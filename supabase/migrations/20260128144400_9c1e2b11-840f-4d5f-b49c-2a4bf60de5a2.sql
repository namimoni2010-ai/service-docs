-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Create sales_bills table
CREATE TABLE public.sales_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Customer Details
  customer_name TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_mobile TEXT NOT NULL,
  customer_state TEXT NOT NULL,
  
  -- Vehicle Details (Admin Only)
  vehicle_model TEXT NOT NULL,
  vehicle_color TEXT NOT NULL,
  hsn_sac_code TEXT NOT NULL,
  chassis_number TEXT NOT NULL,
  motor_number TEXT NOT NULL,
  
  -- Pricing
  taxable_price DECIMAL(12,2) NOT NULL,
  sgst_amount DECIMAL(12,2) NOT NULL,
  cgst_amount DECIMAL(12,2) NOT NULL,
  ex_showroom_price DECIMAL(12,2) NOT NULL,
  rounded_off DECIMAL(12,2) DEFAULT 0,
  total_invoice_amount DECIMAL(12,2) NOT NULL,
  
  -- Battery Details
  battery_chemistry TEXT,
  battery_capacity TEXT,
  battery_make TEXT,
  battery_manufacturing_year TEXT,
  
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create service_bills table
CREATE TABLE public.service_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_bill_id UUID REFERENCES public.sales_bills(id) ON DELETE CASCADE NOT NULL,
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vehicle_number TEXT,
  
  -- Service items stored as JSONB array
  service_items JSONB NOT NULL DEFAULT '[]',
  
  -- Summary
  sub_total DECIMAL(12,2) NOT NULL,
  gst_amount DECIMAL(12,2) DEFAULT 0,
  apply_gst BOOLEAN DEFAULT false,
  final_amount DECIMAL(12,2) NOT NULL,
  
  -- Notes
  service_notes TEXT,
  next_service_date DATE,
  
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bills ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Sales bills policies
CREATE POLICY "Admins can view all sales bills"
  ON public.sales_bills FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create sales bills"
  ON public.sales_bills FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sales bills"
  ON public.sales_bills FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sales bills"
  ON public.sales_bills FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service bills policies
CREATE POLICY "Admins can view all service bills"
  ON public.service_bills FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create service bills"
  ON public.service_bills FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update service bills"
  ON public.service_bills FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete service bills"
  ON public.service_bills FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_bills_updated_at
  BEFORE UPDATE ON public.sales_bills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_bills_updated_at
  BEFORE UPDATE ON public.service_bills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate invoice number function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_number TEXT;
  current_year TEXT;
  next_seq INTEGER;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM 'INV-' || current_year || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO next_seq
  FROM public.sales_bills
  WHERE invoice_number LIKE 'INV-' || current_year || '-%';
  
  new_number := 'INV-' || current_year || '-' || LPAD(next_seq::TEXT, 4, '0');
  RETURN new_number;
END;
$$;