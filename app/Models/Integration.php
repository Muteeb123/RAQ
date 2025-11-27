<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Integration extends Model
{
    //

    protected $fillable = [
        'user_id',
        'platform',
        'apiKey',
        'status',
    ];
}
