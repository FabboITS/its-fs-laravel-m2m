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

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Customers $customers)
    {
        //
    }
}
