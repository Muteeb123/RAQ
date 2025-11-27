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
        Schema::table('proposals', function (Blueprint $table) {
            //
            $table->dropColumn(columns: 'shipping');
            $table->decimal('shipping_amount', 10, 2)->nullable();
            $table->string('shipping_title')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            //
            $table->dropColumn(columns: 'shipping_amount');
            $table->dropColumn(columns: 'shipping_title');
        });
    }
};
