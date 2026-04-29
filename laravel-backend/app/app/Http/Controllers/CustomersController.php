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
        return Customers::findOrFail($id);
    }

    public function show(Customers $customers)
    {
        return Customers::findOrFail($id);
    }

    public function update(Request $request, Customers $customers)
    {
        return Customers::create($request->all());
    }

    public function destroy(Customers $customers)
    {
        Customer::destroy($customers->id);
        return response()->json(['message' => 'Customer deleted successfully']);
    }
}
