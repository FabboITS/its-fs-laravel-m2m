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
        $orders = Orders::create([
            'customer_id' => $request->customer_id,
            'total_ammount' => $request->total_amount,
            'status' => $request->status,
        ]);

        foreach  ($request->products as $p) {
            $orders->products()->attach($p['product_id'], ['quantity' => $p['quantity']
            ]);
        }

        return $orders->load('products');
    }

    public function show(Orders $orders)
    {
        return Orders::with('products', 'customer')->findOrFail($orders->id);
    }

    public function update(Request $request, Orders $orders)
    {
        $orders = Orders::findOrFail($id);
        $orders->update($request->only(['customer_id', 'total_amount', 'status']));

        if ($request->has('products')) {
            $orders->products()->detach();

            foreach ($request->products as $p) {
                $orders->products()->attach($p['product_id'], ['quantity' => $p['quantity']
                ]);
            }
        }

        return $orders->load('products');
    }

    public function destroy(Orders $orders)
    {
        Orders::destroy($orders->id);
        return response()->json(['message' => 'Order deleted successfully']);
    }
}
