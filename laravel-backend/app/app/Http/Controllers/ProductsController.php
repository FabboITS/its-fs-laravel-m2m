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
        return Products::create($request->all());
    }

    public function show(Products $products)
    {
        return Products::findOrFail($products->id);
    }

    public function update(Request $request, Products $products)
    {
        $products = Products::findOrFail($products->id);
        $products->update($request->all());
        return $products;
    }

    public function destroy(Products $products)
    {
        Products::destroy($products->id);
        return response()->json(['message' => 'Product deleted successfully']);
    }
}
