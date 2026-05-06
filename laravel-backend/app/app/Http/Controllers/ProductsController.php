<?php

namespace App\Http\Controllers;

use App\Models\Products;
use Illuminate\Http\Request;

class ProductsController extends Controller
{
    public function index()
    {
        return Products::all();
    }

    public function store(Request $request)
    {
        $validate = $request->validate([
            'order_id' => 'required|integer',
            'products_id' => 'required|integer',
            'quantity' => 'required|integer',
        ]);

        $products = Products::create($validate);

        return response()->json($products, 201);
    }

    public function show(Products $products)
    {
        return Products::findOrFail($products->id);
    }

    public function update(Request $request, Products $products)
    {
        $validate = $request->validate([
            'order_id' => 'integer',
            'products_id' => 'integer',
            'quantity' => 'integer'
        ]);

        $products = Products::findOrFail($products->id);
        $products->update($validate);
        return response()->json($products);
    }

    public function destroy(Products $products)
    {
        Products::destroy($products->id);
        return response()->json(['message' => 'Product deleted successfully'], 204);
    }
}
