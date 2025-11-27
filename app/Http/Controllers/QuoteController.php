<?php

namespace App\Http\Controllers;

use App\Models\Proposal;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Log\Logger;

class QuoteController extends Controller
{
    public function index(Request $request)
    {
        Log::info("Quotes: index() called", $request->all());

        // Read filters
        $search = $request->query('search');
        $status = $request->query('status');
        $limit  = (int) $request->query('limit', 10);
        $page   = (int) $request->query('page', 1);

        $query = Quote::query();

        // -------------------------
        // STATUS FILTER
        // -------------------------
        if (!empty($status) && $status !== 'all') {
            $query->where('status', $status);
        }

        // -------------------------
        // SEARCH FILTER
        // -------------------------
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('quotation_id', 'LIKE', "%{$search}%")
                    ->orWhere('order_id', 'LIKE', "%{$search}%")
                    ->orWhere('customer_name', 'LIKE', "%{$search}%")
                    ->orWhere('customer_email', 'LIKE', "%{$search}%")
                    ->orWhere('shipping_address', 'LIKE', "%{$search}%");
            });
        }

        // -------------------------
        // Pagination (page + limit)
        // -------------------------
        $quotes = $query->orderBy('id', 'desc')
            ->paginate($limit, ['*'], 'page', $page);

        // -------------------------
        // Clean formatting
        // -------------------------
        $formatted = $quotes->through(function ($quote) {

            $formData = is_array($quote->form_data)
                ? $quote->form_data
                : json_decode($quote->form_data, true);

            return [
                'id'               => (string) $quote->id,
                'quotation_id'     => $quote->quotation_id,
                'proposal' => Proposal::where('quote_id', $quote->quotation_id)->latest()->first(),

                'order_id'         => $quote->order_id ?? $quote->draft_order_id ?? "—",
                'product_id'       => $quote->product_id,
                'variant_id'      => $quote->variant_id,
                'customer_name'    => $quote->customer_name ?? "—",
                'customer_email'   => $quote->customer_email ?? "—",
                'shipping_address' => $quote->shipping_address ?? "—",
                'status'           => $quote->status,
                'quantity'         => $quote->quantity ?? 1,
                'form_data'        => $formData ?? [],
                'price' => $quote->product->productVarients->first() ? $quote->product->productVarients->first()->price : 'N/A',
            ];
        });

        return response()->json([
            'quotes' => [
                'data'  => $formatted,
                'total' => $quotes->total(),
            ]
        ]);
    }


    public function view()
    {
        return Inertia::render('Embedded/QuoteListing');
    }

    public function createOrder(Request $request)
    {
        $request->validate([
            'quotation_id' => 'required|string',
        ]);

        Log::info("Quotes: createOrder() called", $request->all());

        $quotationId = $request->input('quotation_id');
        $draftOrderId = Quote::where('quotation_id', $quotationId)->value('draft_order_id');
        $user = auth()->user();
        $shop = $user->name;
        $accessToken = $user->password;

        $graphqlEndpoint = "https://$shop/admin/api/2025-10/graphql.json";

        // Mutation without the removed 'order' field
        $mutation = <<<GQL
mutation draftOrderComplete(\$id: ID!) {
  draftOrderComplete(id: \$id) {
    draftOrder {
      id
      status
    }
    userErrors {
      field
      message
    }
  }
}
GQL;

        $response = Http::withHeaders([
            'X-Shopify-Access-Token' => $accessToken,
            'Content-Type' => 'application/json',
        ])->post($graphqlEndpoint, [
            'query' => $mutation,
            'variables' => ['id' => $draftOrderId],
        ]);

        $responseBody = $response->json();
        Log::info('Shopify Draft Order Completion Response', $responseBody);

        // Check for errors
        $userErrors = $responseBody['data']['draftOrderComplete']['userErrors'] ?? [];
        if (!empty($userErrors)) {
            Log::error('Shopify Draft Order Completion Error', $responseBody);
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete draft order',
                'errors' => $userErrors,
            ], 400);
        }

        // Update local database
        Quote::where('quotation_id', $quotationId)->update([
            'status' => 'created',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Draft order completed successfully',
        ]);
    }
}
