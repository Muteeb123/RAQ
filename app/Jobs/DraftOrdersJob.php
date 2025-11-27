<?php

namespace App\Jobs;

use App\Mail\QuoteNotificationMail;
use App\Models\Proposal;
use App\Models\Quote;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class DraftOrdersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $draftOrderData;

    public function __construct(array $draftOrderData)
    {
        $this->draftOrderData = $draftOrderData;
    }

    public function handle()
    {
        Log::info('Starting DraftOrdersJob', $this->draftOrderData);

        $payload       = $this->draftOrderData['payload'];
        $shopifyDomain = $this->draftOrderData['shop_domain'];
        $accessToken   = $this->draftOrderData['access_token'];

        /**
         * Line Items
         */
        $lineItems = array_map(function ($item) {
            return [
                'variantId' => $item['variantId'],
                'quantity'  => (int)$item['quantity'],
            ];
        }, $payload['lineItems']);

        /**
         * Prepare discount (already correct in controller)
         */
        $discount = $payload['appliedDiscount'] ?? null;

        /**
         * Shipping Line (array-of-objects or null)
         */
        $shippingLine = $payload['shippingLine'] ?? null;

        /**
         * GraphQL Mutation
         */
        $query = <<<'GRAPHQL'
mutation draftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
        draftOrder {
            id
            name
            status
        }
        userErrors {
            field
            message
        }
    }
}
GRAPHQL;

        /**
         * Variables
         */
        $variables = [
            'input' => [
                'lineItems'       => $lineItems,
                'email'           => $payload['email'],
                'shippingAddress' => $payload['shippingAddress'],
                'note'            => $payload['note'],
            ]
        ];

        if ($discount) {
            $variables['input']['appliedDiscount'] = $discount;
        }

        if ($shippingLine) {
            $variables['input']['shippingLine'] = $shippingLine;
        }

        /**
         * Send Shopify Request
         */
        $response = Http::withHeaders([
            'X-Shopify-Access-Token' => $accessToken,
            'Content-Type' => 'application/json',
        ])->post("https://{$shopifyDomain}/admin/api/2024-10/graphql.json", [
            'query'     => $query,
            'variables' => $variables
        ]);

        $resBody = $response->json();
        Log::info('Shopify Response', $resBody);

        if (!isset($resBody['data']['draftOrderCreate'])) {
            Log::error('draftOrderCreate missing', $resBody);
            return;
        }

        $result = $resBody['data']['draftOrderCreate'];

        if (!empty($result['userErrors'])) {
            Log::error('Draft Order Errors', $result['userErrors']);
            return;
        }

        /**
         * Save Order ID in DB
         */
        Log::info('Updating Quote with Draft Order ID', [
            'quotation_id'   => $payload['quotation_id'],
            'draft_order_id' => $result['draftOrder']['id'],
            'order_id'       => $result['draftOrder']['name'],
        ]);
        Quote::where('quotation_id', $payload['quotation_id'])
            ->update([
                'draft_order_id' => $result['draftOrder']['id'],
                'status'   => 'quoted',
                'order_id' => $result['draftOrder']['name'],

            ]);
        Log::info('Creating Proposal Record', [
            'quote_id' => $payload['quotation_id'],
        ]);
        Log::info('Creating Proposal Record', [
            'quote_id' => $payload['quotation_id'],
            'proposal_price' => $payload['proposalPrice'],
            'items' => $payload['quantity'],
            'discount' => $payload['appliedDiscount']['value'] ?? 0,
            'discount_type' => $payload['appliedDiscount']['valueType'] ?? 'fixed',
            'shipping_amount' => $payload['shippingLine']['price'] ?? 0,
            'shipping_title' => $payload['shippingLine']['title'] ?? null,
            'expiry_days' => $payload['expiryDays'] ?? 10
        ]);
        Proposal::create([
            'quote_id' => $payload['quotation_id'],
            'proposal_price' => $payload['proposalPrice'],
            'items' => $payload['quantity'],
            'discount' => $payload['appliedDiscount']['value'] ?? 0,
            'discount_type' => $payload['appliedDiscount']['valueType'] ?? 'fixed',
            'shipping_amount' => $payload['shippingLine']['price'] ?? 0,
            'shipping_title' => $payload['shippingLine']['title'] ?? null,
            'expiry_days' => $payload['expiryDays'] ?? 10
        ]);
        Mail::to($payload['email'])->send(
            new QuoteNotificationMail($payload['quotation_id'])
        );
        Log::info('Draft Order Created Successfully', $result['draftOrder']);
    }
}
