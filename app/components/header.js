import Link from 'next/link';
import { AiOutlineHome } from 'react-icons/ai';

const Header = () => {
  return (
    <header className="bg-slate-950 p-4 text-white">
      <div className="max-w-4xl">
        <div className="space-x-10 flex">
          <Link href="/" passHref legacyBehavior>
            <a className="text-xl">
              <AiOutlineHome />
            </a>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
