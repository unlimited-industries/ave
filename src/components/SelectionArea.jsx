const SelectionArea = (props) => {
  const { start, end } = props.selectionArea;
  return (
    <div
      class='bg-blue-500 opacity-20'
      style={{
        position: 'absolute',
        left: `${start.x}px`,
        top: `${start.y}px`,
        width: `${end.x - start.x}px`,
        height: `${end.y - start.y}px`,
        "z-index": 10
      }}
    ></div>
  );
};

export default SelectionArea
