// components/Navbar.js

import React from 'react';
import Image from 'next/image';

const Navbar = () => (
  <nav className="w-full h-24 z-20 py-2 top-0 start-0 px-8 align-middle bg-beige">
    <div className="w-full flex flex-wrap items-center  justify-between p-4">
      <a
        href="https://salvemundi.nl"
        className="flex items-center space-x-3 rtl:space-x-reverse"
      >
        <Image
          src="/img/Logo.png"
          alt="Salve Mundi Logo"
          width={80}
          height={80}
          className="w-20 h-auto"
        />
      </a>

      <div className="flex md:order-2">
        <button
          type="button"
          className="focus:outline-none  bg-oranje text-beige rounded-full font-semibold text-sm px-5 py-3 text-center"
        >
          Login
        </button>
      </div>

      <div
        className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
        id="navbar-sticky"
      >
        <ul className="flex flex-col py-3 px-5 mt-4 font-medium border bg-paars rounded-full md:space-x-8 md:flex-row md:mt-0 md:border-0">
          <li>
            <a
              href="#"
              className="block py-2 px-3 hover:bg-transparent font-semibold text-beige md:hover:text-geel md:p-0"
              aria-current="page"
            >
              Home
            </a>
          </li>
          <li>
            <a
              href="#"
              className="block py-2 px-3 rounded hover:bg-transparent font-semibold text-beige md:hover:text-geel md:p-0"
            >
              Intro
            </a>
          </li>
          <li>
            <a
              href="#"
              className="block py-2 px-3 rounded hover:bg-transparent font-semibold text-beige md:hover:text-geel md:p-0"
            >
              Inschrijven
            </a>
          </li>
          <li>
            <a
              href="#"
              className="block py-2 px-3 rounded hover:bg-transparent font-semibold text-beige md:hover:text-geel md:p-0"
            >
              Activiteiten
            </a>
          </li>
          <li>
            <a
              href="#"
              className="block py-2 px-3 rounded hover:bg-transparent font-semibold text-beige md:hover:text-geel md:p-0"
            >
              Commissies
            </a>
          </li>
          <li>
            <a
              href="#"
              className="block py-2 px-3 rounded hover:bg-transparent font-semibold text-beige md:hover:text-geel md:p-0"
            >
              Contact
            </a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
);

export default Navbar;
