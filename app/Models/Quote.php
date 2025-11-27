<?php

namespace App\Models;

use App\Models\Products\Product;
use Illuminate\Database\Eloquent\Model;

class Quote extends Model
{


    protected $fillable = [
        'quotation_id',
        'form_data',
        'status',
        'product_id',
        'customer_name',
        'customer_email',
        'quantity',
        'shipping_address',
        'variant_id',
        'draft_order_id',
        'SKU',
    ];

    protected $casts = [
        'form_data' => 'array',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
