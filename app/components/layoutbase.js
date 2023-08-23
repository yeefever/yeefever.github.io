import Header from './header';
import Footer from './footer';
const LayoutBase = ({ children }) => {
  return (
    <>
     <Header></Header>
    <div className="bg-gray-100 min-h-screen">

      <main className="p-4">
        {children}
      </main>
    </div>
    <Footer></Footer>
    </>
  );
};

export default LayoutBase;
