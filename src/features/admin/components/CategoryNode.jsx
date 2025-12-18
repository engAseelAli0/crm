import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Trash2 } from 'lucide-react';
import styles from './CategoryNode.module.css';

const CategoryNode = ({ node, depth, onAddChild, onEdit, onDelete, onMove, allowChildren = true }) => {
    const [expanded, setExpanded] = useState(false);

    // We handle indentation via inline style as it's dynamic, 
    // but the border/padding for children can be class-based if depth > 0
    // Actually depth > 0 style in original was: 
    // marginLeft: `${depth * 1.5}rem`, borderLeft: depth > 0 ? '1px dashed...' : 'none'
    // I'll keep the marginLeft inline.

    return (
        <div
            className={`${styles.container} ${depth > 0 ? styles.containerWithBorder : ''}`}
            style={{ marginRight: depth > 0 ? `${depth * 1.5}rem` : 0 }}
        >
            <div className={styles.node}>
                {(node.children && node.children.length > 0) && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className={styles.expandBtn}
                    >
                        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                )}

                <div className={`${styles.dot} ${depth === 0 ? styles.dotRoot : styles.dotChild}`} />

                <span className={depth === 0 ? styles.textRoot : styles.textChild}>
                    {node.name}
                    {node.is_required && <span style={{ color: '#f87171', marginRight: '6px', fontWeight: 'bold' }} title="حقل إلزامي">*</span>}
                </span>

                <div className={styles.actions}>
                    {allowChildren && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddChild(node.id);
                            }}
                            className={`${styles.badgeBtn} ${styles.badgeBlue}`}
                            title="إضافة فرعي"
                        >
                            <Plus size={14} />
                            <span>فرعي</span>
                        </button>
                    )}

                    {/* Move Handle (Drag) */}
                    <div
                        draggable
                        onDragStart={(e) => {
                            e.stopPropagation();
                            onMove(e, node, 'start');
                        }}
                        onDragOver={(e) => {
                            e.preventDefault(); // Allow drop
                            e.stopPropagation();
                            onMove(e, node, 'over');
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onMove(e, node, 'drop');
                        }}
                        className={`${styles.badgeBtn}`}
                        style={{
                            padding: '4px',
                            background: 'rgba(255,255,255,0.05)',
                            color: '#94a3b8',
                            cursor: 'grab',
                            marginLeft: '4px',
                            marginRight: '4px'
                        }}
                        title="اسحب للترتيب"
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                            <div style={{ width: '12px', height: '2px', background: 'currentColor', opacity: 0.5 }}></div>
                            <div style={{ width: '12px', height: '2px', background: 'currentColor', opacity: 0.5 }}></div>
                            <div style={{ width: '12px', height: '2px', background: 'currentColor', opacity: 0.5 }}></div>
                        </div>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(node);
                        }}
                        className={`${styles.badgeBtn} ${styles.badgeGreen}`}
                        title="تعديل الاسم"
                    >
                        تعديل
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(node.id);
                        }}
                        className={`${styles.badgeBtn} ${styles.badgeRed}`}
                        title="حذف التصنيف"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {expanded && node.children && (
                <div className={styles.childrenContainer}>
                    {node.children.map(child => (
                        <CategoryNode
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            onAddChild={onAddChild}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onMove={onMove}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CategoryNode;
