import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CarFilter = ({ filters, setFilters, filterOptions, onClear }) => {
  const handleValueChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const priceRanges = [
    { value: '0-100000', label: 'Até R$100.000' },
    { value: '100000-200000', label: 'R$100k - R$200k' },
    { value: '200000-300000', label: 'R$200k - R$300k' },
    { value: '300000-400000', label: 'R$300k - R$400k' },
    { value: '400000-9999999', label: 'Acima de R$400k' },
  ];
  
  const mileageRanges = [
    { value: '0-30000', label: 'Até 30.000 km' },
    { value: '30000-60000', label: '30.000 - 60.000 km' },
    { value: '60000-100000', label: '60.000 - 100.000 km' },
    { value: '100000-999999', label: 'Acima de 100.000 km' },
  ];

  const renderSelect = (name, placeholder, options) => (
    <motion.div whileHover={{ y: -2 }}>
      <Select value={filters[name] || ''} onValueChange={(value) => handleValueChange(name, value)}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option, index) => (
            typeof option === 'object' ?
            <SelectItem key={index} value={option.value}>{option.label}</SelectItem> :
            <SelectItem key={index} value={String(option)}>{option}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-gray-900/90 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-gray-700 mb-12"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-center">
        <motion.div whileHover={{ y: -2 }} className="relative sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
                type="text" name="model" value={filters.model || ''} onChange={handleInputChange}
                placeholder="Buscar por marca ou modelo..."
                className="w-full h-12 bg-gray-900 border border-gray-600 rounded-md py-3 pl-12 pr-4 text-gray-200 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 transition-all duration-300"
            />
        </motion.div>
        
        {renderSelect('price', 'Faixa de Preço', priceRanges)}
        {renderSelect('mileage', 'Quilometragem', mileageRanges)}
        {renderSelect('year', 'Ano', filterOptions.years)}
        {renderSelect('transmission', 'Câmbio', filterOptions.transmissions)}
        {renderSelect('bodyType', 'Carroceria', filterOptions.bodyTypes)}
        {renderSelect('color', 'Cor', filterOptions.colors)}
        
        <div className="col-span-full flex justify-end">
            <Button onClick={onClear} variant="ghost" className="text-gray-400 hover:text-white transition-colors">
                <X className="mr-2" size={16} />
                Limpar Filtros
            </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default CarFilter;
