<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Form extends Model
{
    // Fillable columns for mass assignment
    protected $fillable = [
        'name',
        'description',
        'cta_text',
        'redirect_url',
        'email_required',
        'redirect_enabled',
        'client_login',
        'allow_file_upload',
        'email_value',
        'redirect_url_value',
    
        'fields',
    ];

    // Cast columns to proper types automatically
    protected $casts = [
        'fields' => 'array',                // JSON fields as array
        'email_required' => 'boolean',      // Boolean flags
        'redirect_enabled' => 'boolean',
        'client_login' => 'boolean',
        'allow_file_upload' => 'boolean',
       
    ];
}
