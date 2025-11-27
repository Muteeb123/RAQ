<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            //
            $table->boolean('hide_price')->default(false);
            $table->boolean('hide_add_to_cart')->default(false)->after('hide_price');
            $table->boolean('hide_SKU')->default(false)->after('hide_add_to_cart');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            //
            $table->dropColumn(['hide_price', 'hide_add_to_cart', 'hide_SKU']);
        });
    }
};
