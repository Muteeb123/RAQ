<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {

        DB::table('proposals')->update([

            'shipping_amount' => DB::raw("IF(shipping_amount REGEXP '^-?[0-9]+(\\.[0-9]+)?$', shipping_amount, 0)"),
            'discount' => DB::raw("IF(discount REGEXP '^-?[0-9]+(\\.[0-9]+)?$', discount, 0)")
        ]);
        Schema::table('proposals', function (Blueprint $table) {
            //
            $table->decimal('shipping_amount', 15, 2)->change();
            $table->decimal('discount', 15, 2)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            //
        });
    }
};
