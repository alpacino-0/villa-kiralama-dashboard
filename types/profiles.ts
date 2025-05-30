export type Profile = {
    id: string;
    email: string;
    full_name: string | null;
    phone_number: string | null;
    role: 'ADMIN' | 'CUSTOMER'; 
    created_at: string | null;  
  }
  
  export type ProfileFormData = Omit<Profile, 'id' | 'created_at'>;