<?php

namespace App\Http\Controllers;

use App\Jobs\DraftOrdersJob;
use App\Models\Products\Product;
use App\Models\Proposal;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ProposalController extends Controller
{
    //

    public function index(Request $request)
    {
        Log::info("Accessing ProposalController index method", $request->all());
        return Inertia::render('Embedded/SendProposal', [
            'quote' => $request->input('quote')
        ]);
    }

    public function create(Request $request)
    {
        $data = $request->all();
        $userid = auth()->user()->id;
        $shop = User::find($userid);
        Log::info("Preparing to create draft order", $data);
        $accesstoken = $shop->password;
        $shopdomain  = $shop->name;
        $proposalPrice = (float)$data['finalTotal'];
        // Validate product
        $product = Product::find($data['product_id']);
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $variantGID = "gid://shopify/ProductVariant/" . $data['variant_id'];

        /**
         * Build DraftOrderInput (MUST match Shopify schema)
         */
        $draftOrderData = [
            'lineItems' => [
                [
                    'variantId' => $variantGID,
                    'quantity'  => (int)$data['quantity'],
                ]
            ],
            'note' => "Quotation ID: " . $data['quotation_id'],
            'email' => $data['customerInfo']['email'],
            'shippingAddress' => [
                'address1'  => $data['customerInfo']['shippingAddress'],
                'firstName' => $data['customerInfo']['name'],
            ],
            'quotation_id' => $data['quotation_id'],  // ⭐ required later for DB update
            'tags' => ['Quotation'],
            'proposalPrice' => $proposalPrice, // Custom field for our reference
            'quantity' => (int)$data['quantity'], // Custom field for our reference
            'expiryDays' => (int)$data['expiryDays'], // Custom field for our reference
        ];

        /**
         * Shipping Line (must be array-of-objects or omitted)
         */
        if (!empty($data['shippingTitle'])) {
            $draftOrderData['shippingLine'] = [
                'title' => $data['shippingTitle'],
                'price' => (float)$data['shippingAmount']
            ];
        }

        /**
         * Discount must be:
         *   value: FLOAT
         *   valueType: FIXED_AMOUNT | PERCENTAGE
         */
        if (!empty($data['discountValue'])) {

            $floatValue = (float)$data['discountValue'];

            $draftOrderData['appliedDiscount'] = [
                'description'  => 'Quote Discount',
                'value'        => $floatValue,  // ⭐ FLOAT ONLY (NO nested object)
                'valueType'    => $data['discountType'] === 'percentage'
                    ? 'PERCENTAGE'
                    : 'FIXED_AMOUNT',
            ];
        }

        // Remove null fields
        $draftOrderData = array_filter($draftOrderData, fn($v) => $v !== null);

        /**
         * Dispatch Job
         */
        DraftOrdersJob::dispatch([
            'payload'      => $draftOrderData,
            'access_token' => $accesstoken,
            'shop_domain'  => $shopdomain,
        ]);

        return response()->json(['message' => 'Proposal Sent Successfully']);
    }

    public function viewProposal($quotation_id)
    {
        // Fetch the quote with related product
        $quote = Quote::where('quotation_id', $quotation_id)->first();

        if (!$quote) {
            return response()->json([
                'message' => 'Quotation not found'
            ], 404);
        }
        if ($quote->status === 'accepted') {
            Log::info("Proposal already accepted", ['quotation_id' => $quotation_id]);
            return response()->json([
                'message' => 'You have already Accepted to the Proposal'
            ], 105);
        }
        if ($quote->status === 'rejected') {
            Log::info("Proposal already rejected", ['quotation_id' => $quotation_id]);
            return response()->json([
                'message' => 'You have already Rejected the Proposal'
            ], 105);
        }

        // Fetch product and variant info
        $product = Product::find($quote->product_id);

        if (!$product) {
            return response()->json([
                'message' => 'Product not found for this quotation'
            ], 404);
        }

        // Assume Quote stores variant_id and quantity
        $variantId = $quote->variant_id;  // or shopify_variant_id if stored
        $variantSKU = $product->productVarients()->where('shopify_product_varient_id', operator: $variantId)->value('sku');
        $variantTitle = $product->productVarients()->where('shopify_product_varient_id', $variantId)->value('title');
        $variantPrice = $product->productVarients()->where('shopify_product_varient_id', $variantId)->value('price');

        $proposal = Proposal::where('quote_id', $quotation_id)->first();
        $quantity = $proposal->items;


        // Pricing
        $pricePerUnit = $variantPrice; // assume price stored in quote or product
        $subtotal = $pricePerUnit * $quantity;

        $discount = $proposal->discount ?? 0;
        $discountType = $proposal->discount_type ?? 'FIXED_AMOUNT'; // FIXED_AMOUNT or PERCENTAGE

        if ($discountType === 'PERCENTAGE') {
            $discountAmount = ($subtotal * $discount) / 100;
        } else {
            $discountAmount = $discount;
        }

        $shippingCharges = $proposal->shipping ?? 0;

        $finalTotal = $subtotal - $discountAmount + $shippingCharges;

        // Return response
        $proposal = ([
            'quotation_id' => $quote->quotation_id,
            'status' => $quote->status,
            'product' => [
                'title' => $product->title,
                'image' => $product->productMedias[0]->src ?? null,
            ],
            'variant' => [
                'sku' => $variantSKU,
                'title' => $variantTitle,
                'quantity' => $quantity,
                'price_per_unit' => $pricePerUnit,
            ],
            'pricing' => [
                'subtotal' => $subtotal,
                'discount' => $discountAmount,
                'shipping_charges' => $shippingCharges,
                'final_total' => $finalTotal
            ]
        ]);
        Log::info("Viewing proposal", $proposal);
        return Inertia::render('Embedded/ProposalPage', [
            'proposal' => $proposal
        ]);
    }

    public function CustomerReply($action, $quotation_id)
    {
        // Logic to accept the proposal

        $quotation = Quote::where('quotation_id', $quotation_id)->first();
        if (!$quotation) {
            return response()->json(['message' => 'Quotation not found'], 404);
        }
        if ($action === 'accept') {
            $quotation->status = 'accepted';
        } elseif ($action === 'reject') {
            $quotation->status = 'rejected';
        } else if ($action === 'archive') {
            $quotation->status = 'archived';
        } else if ($action === 'delete') {
            $quotation->delete();
            return response()->json(['message' => 'Quotation deleted successfully']);
        } else {
            return response()->json(['message' => 'Invalid action'], 400);
        }

        $quotation->save();

        return response()->json(['message' => 'Quotation status updated successfully']);
    }
}
