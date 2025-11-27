<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proposal extends Model
{
    //

    protected $fillable = [
        'quote_id',
        'proposal_price',
        'items',
        'discount',
        'discount_type',
        'shipping_amount',
        'shipping_title',
        'expiry_days',
    ];

    public function quote()
    {
        return $this->belongsTo(Quote::class, 'quote_id', 'quotation_id');
    }
}
