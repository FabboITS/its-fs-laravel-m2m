<?php

use App\Http\Controllers\CustomersController;
use App\Http\Controllers\OrdersController;
use App\Http\Controllers\ProductsController;
use Illuminate\Support\Facades\Route;

Route::apiResource('customers', CustomersController::class);
Route::apiResource('products', ProductsController::class);
Route::apiResource('orders', OrdersController::class);

Route::get('customers/{customer}/orders', [CustomersController::class, 'orders']);
Route::get('orders/{order}/products', [OrdersController::class, 'products']);
Route::post('orders/{order}/products/{product}', [OrdersController::class, 'attachProduct']);
Route::delete('orders/{order}/products/{product}', [OrdersController::class, 'detachProduct']);
Route::get('products/{product}/orders', [ProductsController::class, 'orders']);