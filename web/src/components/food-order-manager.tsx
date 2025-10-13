"use client";

import React, { useState, useEffect } from "react";
import { ShoppingCart, Clock, User, Phone, MapPin, CheckCircle, Truck, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FoodOrder {
  order_id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total_amount: number;
  delivery_time: string;
  delivery_address: string;
  notes: string;
  status: string;
  created_at: string;
}

export function FoodOrderManager() {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8001/food-orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString("id-ID");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const updateOrderStatus = async (orderId: string, status: string, message: string = "") => {
    try {
      const response = await fetch("http://127.0.0.1:8001/update-order-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: orderId,
          status: status,
          message: message
        })
      });
      
      if (response.ok) {
        fetchOrders(); // Refresh orders
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium flex items-center">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Food Orders ({orders.length})
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open("https://outlook.office365.com/owa/calendar/WARTEGOPET@Swosupport.id/bookings/", "_blank")}
        >
          View Bookings
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No food orders yet
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {orders.map((order) => (
            <div key={order.order_id} className="border rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">
                  Order #{order.order_id.slice(0, 8)}
                </div>
                <div className={`text-xs px-2 py-1 rounded ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  order.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {order.status}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-1 text-gray-500" />
                  <span>{order.customer.name}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-3 w-3 mr-1 text-gray-500" />
                  <span>{order.customer.phone}</span>
                </div>
                {order.delivery_address && (
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                    <span className="truncate">{order.delivery_address}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-gray-500" />
                  <span>{formatDateTime(order.delivery_time)}</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t">
                <div className="text-xs font-medium mb-1">Items:</div>
                <div className="space-y-1">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span>{item.name} x{item.quantity}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm font-medium mt-2 pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>

              {order.notes && (
                <div className="mt-2 pt-2 border-t">
                  <div className="text-xs text-gray-600">
                    <strong>Notes:</strong> {order.notes}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-2">
                Created: {formatDateTime(order.created_at)}
              </div>
              
              {order.status === 'pending' && (
                <div className="flex gap-1 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs flex-1"
                    onClick={() => updateOrderStatus(order.order_id, 'confirmed', 'Pesanan dikonfirmasi, sedang diproses')}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs flex-1"
                    onClick={() => updateOrderStatus(order.order_id, 'preparing', 'Pesanan sedang disiapkan')}
                  >
                    <ChefHat className="h-3 w-3 mr-1" />
                    Prepare
                  </Button>
                </div>
              )}
              
              {order.status === 'confirmed' && (
                <div className="flex gap-1 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs flex-1"
                    onClick={() => updateOrderStatus(order.order_id, 'preparing', 'Pesanan sedang disiapkan')}
                  >
                    <ChefHat className="h-3 w-3 mr-1" />
                    Prepare
                  </Button>
                </div>
              )}
              
              {order.status === 'preparing' && (
                <div className="flex gap-1 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs flex-1"
                    onClick={() => updateOrderStatus(order.order_id, 'delivering', 'Pesanan sedang dalam perjalanan')}
                  >
                    <Truck className="h-3 w-3 mr-1" />
                    Deliver
                  </Button>
                </div>
              )}
              
              {order.status === 'delivering' && (
                <div className="flex gap-1 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs flex-1"
                    onClick={() => updateOrderStatus(order.order_id, 'completed', 'Pesanan telah selesai. Terima kasih!')}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}