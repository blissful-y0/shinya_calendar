import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";
import { Category } from "@types";
import styles from "./CategorySelect.module.scss";

type CategorySelectProps = {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
};

export const CategorySelect: React.FC<CategorySelectProps> = ({
  categories,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find((c) => c.id === value);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setIsOpen(false);
  };

  return (
    <div className={styles.categorySelect} ref={dropdownRef}>
      <button
        type="button"
        className={styles.selectButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.selectedValue}>
          {selectedCategory && (
            <>
              <span
                className={styles.colorDot}
                style={{ backgroundColor: selectedCategory.color }}
              />
              <span className={styles.categoryName}>
                {selectedCategory.name}
              </span>
            </>
          )}
        </div>
        <FiChevronDown
          className={`${styles.chevron} ${isOpen ? styles.open : ""}`}
        />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`${styles.option} ${
                category.id === value ? styles.selected : ""
              }`}
              onClick={() => handleSelect(category.id)}
            >
              <span
                className={styles.colorDot}
                style={{ backgroundColor: category.color }}
              />
              <span className={styles.categoryName}>{category.name}</span>
              {category.isDefault && (
                <span className={styles.defaultBadge}>기본</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
