<?php

namespace App\Jobs;

use App\Models\User;
use App\Http\Traits\ResponseTrait;
use App\Http\Traits\ShopifyProductTrait;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use App\Repositories\Product\ProductRepositoryInterface;

class ProductSyncJob implements ShouldQueue
{
    use Queueable, ShopifyProductTrait, ResponseTrait;

    /**
     * Create a new job instance.
     */

    protected $userId;
    public function __construct($userId)
    {
        $this->userId = $userId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $this->getProductRepository(app(ProductRepositoryInterface::class));
        $user = User::find($this->userId);
        if ($user->product_sync==0){
if ($this->getProductsFromShopify($user)) {
            $this->logInfo('Products Syncsdsed successfully from Shopify for user ID: ' . $this->userId);
            $user->product_sync=1;
            $user->save();
        } else {
            $this->logInfo('Products Synced failed from Shopify for user ID: ' . $this->userId);

        }
        }
        
    }
}
