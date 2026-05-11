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
            'name' => ['required', 'string'],
            'price' => ['required', 'integer'],
            'stock' => ['required', 'integer'],
        ]);

        $product = Products::create($validate);

        return response()->json($product, 201);
    }

    public function show(Products $product)
    {
        return Products::findOrFail($product->id);
    }

    public function update(Request $request, Products $product)
    {
        $validate = $request->validate([
            'name' => ['required', 'string'],
            'price' => ['required', 'integer'],
            'stock' => ['required', 'integer'],
        ]);

        $product->update($validate);

        return response()->json($product);
    }

    public function destroy(Products $product)
    {
        $product->delete();
        return response()->json(['message' => 'Product deleted successfully'], 204);
    }
}
