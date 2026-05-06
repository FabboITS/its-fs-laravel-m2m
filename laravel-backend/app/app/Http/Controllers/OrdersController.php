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
            'status' => 'required'
        ]);

        $orders = Orders::create($validate);

        return response()->json($orders, 201);
    }

    public function show(Orders $orders)
    {
        return Orders::with('products', 'customer')->findOrFail($orders->id);
    }

    public function update(Request $request, Orders $orders)
    {
        $validate = $request->validate([
            'customer_id' => 'exists:customers,id',
            'total_amount' => 'numeric',
            'status' => ''
        ]);

        $orders->update($validate);

        return response()->json($orders);
    }

    public function destroy(Orders $orders)
    {
        $orders->delete();
        return response()->json(['message' => 'Order deleted successfully', 204]);
    }
}
