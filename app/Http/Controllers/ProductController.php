<?php

namespace App\Http\Controllers;

use App\Models\Products\Product;
use App\Models\Products\ProductMedia;
use App\Models\Products\ProductVarient;
use App\Models\Quote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProductController extends Controller
{
    //

    public function view()
    {
        Log::info("Hello from FormController view method");
        return Inertia::render('Embedded/ProductListing/ProductListing');
    }


    public function assignForm(Request $request)
    {
        Log::info("Assigning form to products", $request->all());
        $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
            'form_id' => 'required|integer|exists:forms,id',
            'hide_price' => 'nullable|boolean',
            'hide_sku' => 'nullable|boolean',
            'add_to_cart' => 'nullable|boolean',
        ]);
        Log::info("Assigning form to products", $request->all());
        $productIds = $request->input('product_ids');
        $formId = $request->input('form_id');
        $hidePrice = $request->input('hide_price', false);
        $hideSku = $request->input('hide_sku', false);
        $addToCart = $request->input('add_to_cart', true);
        Log::info("Assigning form to products", $request->all());
        // Update all selected products
        Product::whereIn('id', $productIds)->update([
            'form_id' => $formId,
            'hide_price' => $hidePrice,
            'hide_SKU' => $hideSku,
            'hide_add_to_cart' => $addToCart,
        ]);
        Log::info("Assigning form to products", $request->all());
        return response()->json([
            'success' => true,
            'message' => 'Products updated successfully.',
        ]);
    }
    public function index(Request $request)
    {
        $query = Product::where('user_id', auth()->id())
            ->with(['productVarients', 'productMedias']); // Include variants

        // Search filter
        if ($request->filled('search')) {
            $query->where('title', 'like', "%{$request->search}%");
        }

        // Status filter (tab)
        if ($request->filled('status') && in_array($request->status, ['draft', 'archived'])) {
            $query->where('status', $request->status);
        }

        // Pagination
        $perPage = $request->get('limit', 5);
        $products = $query->paginate($perPage, ['*'], 'page', $request->get('page', 1));

        // Transform products for frontend
        $products->getCollection()->transform(function ($product) {
            return [
                'id' => $product->id,
                'title' => $product->title,
                'vendor' => $product->vendor,
                'product_type' => $product->product_type,
                'tags' => $product->tags,
                'status' => $product->status,
                'image' => $product->productMedias->first() ? $product->productMedias->first()->src : null,
                'product_varients' => $product->productVarients->map(function ($variant) {
                    return [
                        'sku' => $variant->sku,
                        'price' => $variant->price,
                    ];
                }),
                'hide_price' =>  $product->hide_price,
                'hide_SKU' =>  $product->hide_SKU,
                'hide_add_to_cart' =>  $product->hide_add_to_cart,
                'form_id' => $product->form_id,
                'form_name' => $product->form ? $product->form->name : "—"
            ];
        });

        // Return JSON matching frontend expectations
        return response()->json([
            'data' => $products->items(),       // <--- frontend expects "data"
            'total' => $products->total(),      // <--- frontend expects "total"
            'current_page' => $products->currentPage(),
            'last_page' => $products->lastPage(),
        ]);
    }

    public function productSettings($productID)
    {
        Log::info("Fetching product settings for product ID: " . $productID);
        $product = Product::select('hide_price', 'hide_add_to_cart', 'hide_SKU', 'form_id')
            ->whereHas('form', function ($query) {
                $query->where('status', 'active');
            })
            ->with('form')
            ->where('shopify_product_id', $productID)
            ->get();
        return response()->json([
            'success' => true,
            'product' => $product,
        ]);
    }

    public function productFormSubmit(Request $request)
    {
        // Capture all fields including dynamic ones
        $data = $request->all();

        // Validate required field
        $request->validate([
            'product_id' => 'required|integer',
        ]);

        // Handle file upload if exists
        if ($request->hasFile('Attachment')) {
            $file = $request->file('Attachment');

            // Store file in storage/app/public/attachments
            $path = $file->store('attachments', 'public');

            // Replace the UploadedFile object with stored path
            $data['Attachment'] = $path;
        }

        // Log incoming request
        Log::info('Product form submission received', $data);

        // Generate unique 8–10 character quotation ID
        $quotationId = strtoupper(Str::random(rand(8, 10)));

        // ----------------------------
        // Extract special fields
        // ----------------------------
        $customerName = $data['Name'] ?? null;
        $customerEmail = $data['Email'] ?? null;
        $shippingAddress = $data['Shipping_Address'] ?? null;
        $quantity = $data['Quantity'] ?? 1;
        $variant_id = $data['variant_id'] ?? null;
        Log::info('Shipping Address: ' . $shippingAddress);
        // ----------------------------
        // Remove fields that should not be in form_data
        // ----------------------------
        $formData = $data;
        unset($formData['product_id']);
        unset($formData['variant_id']);
        unset($formData['Name']);
        unset($formData['Email']);
        unset($formData['Shipping_Address']);
        unset($formData['Quantity']);
        // Get local product DB row
        $product = Product::where('shopify_product_id', $request->product_id)->first();
        $sku = ProductVarient::where('shopify_product_varient_id', $variant_id)->value('sku');
        // ----------------------------
        // Save Quote
        // ----------------------------
        $quote = Quote::create([
            'quotation_id'     => $quotationId,
            'product_id'       => $product ? $product->id : null,
            'variant_id'      => $variant_id,
            'customer_name'    => $customerName,
            'customer_email'   => $customerEmail,
            'shipping_address' => $shippingAddress,
            'quantity'        => $quantity,
            'form_data'        => $formData, // remaining fields stored as JSON
            'SKU'              => $sku,
            'status'           => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'quotation_id' => $quotationId,
            'stored_file' => $data['Attachment'] ?? null,
            'quote' => $quote,
        ]);
    }

    public function show($id, $variant_id)
    {
        //
        Log::info("Fetching product details", ['product_id' => $id, 'variant_id' => $variant_id]);
        $product = Product::with([
            'productVarients' => function ($query) use ($variant_id) {
                $query->select('id', 'product_id', 'sku', 'price') // select only required columns
                    ->where('shopify_product_varient_id', $variant_id); // only the selected variant
            },
            'productMedias' => function ($query) {
                $query->select('product_id', 'src'); // only select src and product_id
            }
        ])->find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found.',
            ], 404);
        }

        // Prepare final output
        $media = $product->productMedias->first(); // get first media
        $variant = $product->productVarients->first(); // the selected variant
        Log::info("Fetched product details", ['product_id' => $id, 'result' => []]);
        Log::info('variant', ['variant' => $variant]);
        $result = [
            'name' => $product->title,
            'handle' => $product->handle,
            'image' => $media ? $media->src : null,
            'sku' => $variant ? $variant->sku : null,
            'price' => $variant ? $variant->price : null,
        ];

        Log::info("Fetched product details", ['product_id' => $id, 'result' => $result]);

        return response()->json([
            'success' => true,
            'product' => $result,
        ]);
    }
}
