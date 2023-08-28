import Header from './header';
import Footer from './footer';
const LayoutBase = ({ children }) => {
  return (
    <>

<div className="bg-gray-100 min-h-screen flex flex-col">
  <Header></Header>
  <main className="p-4 flex-grow">
    {children}
  </main>
  <Footer></Footer>
</div>

    </>
  );
};

export default LayoutBase;
