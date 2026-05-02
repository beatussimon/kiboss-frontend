import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: { id: string | number; url: string }[];
    initialIndex?: number;
}

export default function ImageModal({
    isOpen,
    onClose,
    images,
    initialIndex = 0
}: ImageModalProps) {
    const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, initialIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentIndex, images.length]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (!isOpen || images.length === 0) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950"
                >
                    {/* Header Controls */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
                        <div className="text-white font-medium bg-gray-900 px-4 py-1.5 rounded-full text-sm border border-gray-800">
                            {currentIndex + 1} / {images.length}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-white/70 hover:text-white bg-gray-900 hover:bg-black rounded-full transition-all border border-gray-800 shadow-xl"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Main Image Container */}
                    <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-12">
                        {images.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                className="absolute left-4 sm:left-8 z-50 p-3 sm:p-4 text-white/70 hover:text-white bg-gray-900 hover:bg-black rounded-full transition-all border border-gray-800 hover:scale-110 active:scale-95 shadow-xl"
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                            </button>
                        )}

                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full h-full max-w-7xl max-h-full flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={images[currentIndex].url}
                                alt={`Images ${currentIndex + 1}`}
                                className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm"
                            />
                        </motion.div>

                        {images.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                className="absolute right-4 sm:right-8 z-50 p-3 sm:p-4 text-white/70 hover:text-white bg-gray-900 hover:bg-black rounded-full transition-all border border-gray-800 hover:scale-110 active:scale-95 shadow-xl"
                                aria-label="Next image"
                            >
                                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                            </button>
                        )}
                    </div>

                    {/* Thumbnails (Optional) */}
                    {images.length > 1 && (
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4 overflow-hidden z-20">
                            <div className="flex gap-2 p-2 bg-gray-900 rounded-2xl border border-gray-800 max-w-full overflow-x-auto no-scrollbar shadow-2xl">
                                {images.map((img, i) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setCurrentIndex(i)}
                                        className={`relative w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden transition-all duration-300 ${i === currentIndex
                                            ? 'ring-2 ring-primary-500 scale-110 mx-1 shadow-lg shadow-primary-500/50'
                                            : 'opacity-40 hover:opacity-100 hover:scale-105'
                                            }`}
                                    >
                                        <img
                                            src={img.url}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
