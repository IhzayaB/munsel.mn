export interface CheckboxProps {
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export declare const Checkbox: React.FC<CheckboxProps>;
export default Checkbox;