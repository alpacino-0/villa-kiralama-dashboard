import Link from "next/link";
import { Button } from "@/components/ui/button";

const Home = () => {
  return ( 
    <div className="flex flex-col items-center justify-center h-screen">
      <Button asChild>
        <Link href="/auth/login">Login</Link>
      </Button>
    </div>
  );
}
 
export default Home;