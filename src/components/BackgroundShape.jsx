import React from 'react';
import tCrossImage from '@/assets/t-cross-perfil-cinza.png'; // Importando o carro aqui

const BackgroundShape = () => {
  return (
    <>
      {/* Faixas Diagonais */}
      <div
        className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10"
        aria-hidden="true"
      >
        <div 
          className="absolute top-0 left-[40%] h-full w-24 bg-black opacity-5 transform skew-x-12 sm:w-32 lg:w-48" 
          style={{ transformOrigin: 'top left' }} 
        />
        <div 
          className="absolute top-0 left-[65%] h-full w-24 bg-black opacity-5 transform skew-x-12 sm:w-32 lg:w-48"
          style={{ transformOrigin: 'top left' }}
        />
      </div>

          </>
  );
};

export default BackgroundShape;
