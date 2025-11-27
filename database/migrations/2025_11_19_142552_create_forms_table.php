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
        Schema::create('forms', function (Blueprint $table) {
            $table->id();
            
            // Basic form setup
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('cta_text')->nullable();
            $table->string('redirect_url')->nullable();
            
            // Setup flags for easier access
            $table->boolean('email_required')->default(false);
            $table->boolean('redirect_enabled')->default(false);
            $table->boolean('client_login')->default(false);
            $table->boolean('allow_file_upload')->default(false);
            
            // Optional default values
            $table->string('email_value')->nullable();
            $table->string('redirect_url_value')->nullable();
            
           
            // Custom fields stored as JSON
            $table->json('fields');
            
            // Timestamps
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('forms');
    }
};
