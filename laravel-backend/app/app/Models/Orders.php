<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Orders extends Model
{
    protected $fillable = ['customer_id', 'total_amount', 'status'];

    public function customer()
    {
        return $this->belongsTo(Customers::class);
    }

    public function products()
    {
        return $this->belongsToMany(Products::class, 'order_product', 'order_id', 'product_id')->withPivot('quantity');
    }
}
