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
            $table->decimal('discount', 10, 2)->default(0);
            $table->string('discount_type')->default('fixed'); // 'fixed' or 'percentage'
            $table->decimal('shipping', 10, 2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            //
            $table->dropColumn('discount');
            $table->dropColumn('discount_type');
            $table->dropColumn('shipping');
        });
    }
};
