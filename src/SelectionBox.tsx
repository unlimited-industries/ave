import { Range } from "./model";

interface SelectionBoxProps {
  selectionRange: Range;
}

const SelectionBox = (props: SelectionBoxProps) => {
  const { start, end } = props.selectionRange;
  
  return (
    <div
      class='bg-blue-500 opacity-20'
      style={{
        position: 'absolute',
        left: `${start[0]}px`,
        top: `${start[1]}px`,
        width: `${end[0] - start[0]}px`,
        height: `${end[1] - start[1]}px`,
        "z-index": 10
      }}
    ></div>
  );
};

export default SelectionBox
