import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShows:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const update = [...cart];
      const exists = update.find(product => product.id === productId);

      const stock = await api.get(`/stock/${productId}`);

      const mountStock = stock.data.amount
      const stockAtual = exists ? exists.amount : 0;
      const atual = stockAtual + 1;

      if (atual > mountStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (exists){
        exists.amount = atual;
      } else {
        const product = await api.get(`/products/${productId}`);

        const novoProd = {
          ...product.data,
          amount: 1
        }
        update.push(novoProd);
      }

      setCart(update);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(update))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const isInCart = [...cart];
      const productCart = isInCart.findIndex(product => product.id === productId);
      
      if(productCart >= 0){
        isInCart.splice(productCart, 1)
        setCart(isInCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(isInCart))
      }else{
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) {
        return;
      }

      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const isInCart = [...cart];
      const productExists = isInCart.find(product => product.id === productId);

      if(productExists){
        productExists.amount = amount;
        setCart(isInCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(isInCart))
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
