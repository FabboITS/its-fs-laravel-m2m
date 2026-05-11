<?php

namespace App\Http\Controllers;

use App\Models\Orders;
use Illuminate\Http\Request;

class OrdersController extends Controller
{
    public function index()
    {
        return Orders::with('products', 'customer')->get();
    }

    public function store(Request $request)
    {
        $validate = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'total_amount' => 'required|numeric',
            'status' => 'required|string',
            'products' => 'required|array',
            'products.*.product_id' => 'required|exists:products,id',
            'products.*.quantity' => 'required|integer|min:1',
        ]);

        $order = Orders::create([
            'customer_id' => $validate['customer_id'],
            'total_amount' => $validate['total_amount'],
            'status' => $validate['status'],
        ]);

        foreach ($validate['products'] as $product) {
            $order->products()->attach($product['product_id'], ['quantity' => $product['quantity']]);
        }

        return response()->json($order->load('products', 'customer'), 201);
    }

    public function show(Orders $order)
    {
        return Orders::with('products', 'customer')->findOrFail($order->id);
    }

    public function update(Request $request, Orders $order)
    {
        $validate = $request->validate([
            'customer_id' => 'sometimes|exists:customers,id',
            'total_amount' => 'sometimes|numeric',
            'status' => 'sometimes|string',
            'products' => 'sometimes|array',
            'products.*.product_id' => 'required_with:products|exists:products,id',
            'products.*.quantity' => 'required_with:products|integer|min:1',
        ]);

        $order->update([
            'customer_id' => $validate['customer_id'] ?? $order->customer_id,
            'total_amount' => $validate['total_amount'] ?? $order->total_amount,
            'status' => $validate['status'] ?? $order->status,
        ]);

        if (isset($validate['products'])) {
            $order->products()->detach();
            foreach ($validate['products'] as $product) {
                $order->products()->attach($product['product_id'], ['quantity' => $product['quantity']]);
            }
        }

        return response()->json($order->load('products', 'customer'));
    }

    public function destroy(Orders $order)
    {
        $order->delete();
        return response()->json(['message' => 'Order deleted successfully'], 204);
    }
}
