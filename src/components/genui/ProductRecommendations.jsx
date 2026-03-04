/**
 * ProductRecommendations - AI-powered product discovery component
 * Renders a personalized product grid with AI-extracted budget/category filters
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Filter, Tag, Check } from 'lucide-react';

export function ProductRecommendations({ data, config = {} }) {
    const { layout = 'grid', showFilters = true, showRatings = true, animate = true } = config;
    const [selectedCategory, setSelectedCategory] = useState(data?.activeCategory || 'all');
    const [addedItems, setAddedItems] = useState([]);

    if (!data || !data.products || data.products.length === 0) {
        return <div className="genui-empty">No products found</div>;
    }

    const MotionDiv = animate ? motion.div : 'div';

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const filteredProducts = selectedCategory === 'all'
        ? data.products
        : data.products.filter(p => p.category === selectedCategory);

    const handleAddToCart = (productId) => {
        setAddedItems(prev => [...prev, productId]);
    };

    return (
        <div className={`product-recommendations ${layout}`}>
            <div className="product-header">
                <h3>{data.title}</h3>
                {data.aiContext && (
                    <span className="ai-filter-badge">
                        <Filter size={12} /> {data.aiContext}
                    </span>
                )}
            </div>

            {showFilters && data.categories && data.categories.length > 1 && (
                <div className="product-filters">
                    {data.categories.map(cat => (
                        <button
                            key={cat}
                            className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat === 'all' ? 'All' : cat}
                        </button>
                    ))}
                </div>
            )}

            <MotionDiv
                className="product-grid"
                {...(animate && { variants: containerVariants, initial: 'hidden', animate: 'visible' })}
            >
                {filteredProducts.map((product) => {
                    const isAdded = addedItems.includes(product.id);
                    return (
                        <MotionDiv
                            key={product.id}
                            className={`product-card ${product.badge ? 'has-badge' : ''}`}
                            {...(animate && { variants: itemVariants })}
                        >
                            {product.badge && (
                                <span className="product-badge">{product.badge}</span>
                            )}

                            <div className="product-icon">
                                <span className="product-emoji">{product.emoji || '📦'}</span>
                            </div>

                            <h4 className="product-name">{product.name}</h4>
                            <p className="product-description">{product.description}</p>

                            <div className="product-price">
                                {product.originalPrice && (
                                    <span className="price-original">${product.originalPrice.toFixed(2)}</span>
                                )}
                                <span className="price-current">${product.price.toFixed(2)}</span>
                            </div>

                            {showRatings && product.rating && (
                                <div className="product-rating">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star
                                            key={star}
                                            size={12}
                                            className={star <= product.rating ? 'star-filled' : 'star-empty'}
                                        />
                                    ))}
                                    <span className="rating-count">({product.reviews})</span>
                                </div>
                            )}

                            {product.tags && (
                                <div className="product-tags">
                                    {product.tags.map(tag => (
                                        <span key={tag} className="product-tag">
                                            <Tag size={10} /> {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <button
                                className={`add-to-cart-btn ${isAdded ? 'added' : ''}`}
                                onClick={() => handleAddToCart(product.id)}
                                disabled={isAdded}
                            >
                                {isAdded
                                    ? <><Check size={14} /> Added</>
                                    : <><ShoppingCart size={14} /> Add to Cart</>
                                }
                            </button>
                        </MotionDiv>
                    );
                })}
            </MotionDiv>

            {data.budgetNote && (
                <div className="budget-note">
                    <Tag size={12} /> {data.budgetNote}
                </div>
            )}
        </div>
    );
}

export default ProductRecommendations;
