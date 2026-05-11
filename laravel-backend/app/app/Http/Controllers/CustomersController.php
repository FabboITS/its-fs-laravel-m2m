<?php

namespace App\Http\Controllers;

use App\Models\Customers;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomersController extends Controller
{
    public function index()
    {
        return Customers::all();
    }

    public function store(Request $request)
    {
        $validate = $request->validate([
            'email' => ['required', 'email', Rule::unique('customers')],
            'name' => 'required',
        ]);

        $customers = Customers::create($validate);

        return response()->json($customers, 201);
    }

    public function show(Customers $customer)
    {
        return $customer->load(['orders', 'products']);
    }

    public function update(Request $request, Customers $customer)
    {
        $validate = $request->validate([
            'email' => ['required', 'email', Rule::unique('customers')->ignore($customer->id)],
            'name' => ['required', 'string', 'max:255'],
        ]);

        $customer->update($validate);

        return response()->json($customer);
    }

    public function destroy(Customers $customer)
    {
       $customer->delete();
       return response()->json(['message' => 'Customer deleted successfully']);
    }
}
