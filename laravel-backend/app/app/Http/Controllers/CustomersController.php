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

    public function show(Customers $customers)
    {
        return $customers->load(['orders', 'products']);
    }

    public function update(Request $request, Customers $customers)
    {
        $validate = $request->validate([
            'email' => ['sometimes', 'required', 'email'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
        ]);

        $customers->update($validate);

        return response()->json($customers);
    }

    public function destroy(Customers $customer)
    {
       $customer->delete();
       return response()->json(['message' => 'Customer deleted successfully']);
    }
}
