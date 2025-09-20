import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ApiKey from '@/models/ApiKey';
import User from '@/models/User';
import { auth } from '../../auth/[...nextauth]/route';

// DELETE - Delete a specific API key
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = params;
    
    // Find the API key and ensure it belongs to the authenticated user
    const apiKey = await ApiKey.findOne({ _id: id, userId: user._id });
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    apiKey.isActive = false;
    await apiKey.save();
    
    return NextResponse.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update API key (e.g., rename)
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = params;
    const { name } = await request.json();
    
    // Find the API key and ensure it belongs to the authenticated user
    const apiKey = await ApiKey.findOne({ _id: id, userId: user._id, isActive: true });
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    if (name) {
      apiKey.name = name;
      await apiKey.save();
    }
    
    return NextResponse.json({
      _id: apiKey._id,
      key: apiKey.key,
      name: apiKey.name,
      createdAt: apiKey.createdAt,
      isActive: apiKey.isActive
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 