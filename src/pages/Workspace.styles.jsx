import { styled } from "solid-styled-components";

const WorkspaceArea = styled('div')`
  position: absolute;
  width:  100%;
  height: 100%;
  transform: ${props => props.matrix.toString()};
  transform-origin: top left;
  cursor: ${props => props.cursor};

  &::before {
    content: "";
    position: absolute;
    transform: ${(props) => props.matrix.inverse().toString()};
    transform-origin: top left;
    width: 100%;
    height: 100%;
  }
`;

export default WorkspaceArea;
