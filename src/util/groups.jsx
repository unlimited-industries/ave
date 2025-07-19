import { bfs } from "./common";

const links = [
  {
    x: (n1, n2, offset) => n2.x - n1.x - n1.width - offset,
    y: (n1, n2) => n1.y + 0.5 * (n1.height - n2.height) - n2.y, xSign: 1, ySign: -1, link: 2
  },
  {
    x: (n1, n2, offset) => n1.x - n2.x - n2.width - offset,
    y: (n1, n2) => n1.y + 0.5 * (n1.height - n2.height) - n2.y, xSign: -1, ySign: -1, link: 0
  },
  {
    x: (n1, n2) => n1.x + 0.5 * (n1.width - n2.width) - n2.x,
    y: (n1, n2, offset) => n2.y - n1.y - n1.height - offset, xSign: -1, ySign: 1, link: 3
  },
  {
    x: (n1, n2) => n1.x + 0.5 * (n1.width - n2.width) - n2.x,
    y: (n1, n2, offset) => n1.y - n2.y - n2.height - offset, xSign: -1, ySign: -1, link: 1,
  },
];

const getLink = (builder1, builder2, pointer) => {
  const note1 = builder1?.note;
  const note2 = builder2?.note;

  for (const { x, y, xSign, ySign, link } of links) {
    const blank = pointer && {x: 0, y: 0, width: 0, height: 0};
    const distance = pointer && Math.pow(x(note1, blank, 30) * -xSign - pointer.x, 2) + Math.pow(y(note1, blank, 30) * -ySign - pointer.y, 2);
    
    if ((distance && (distance < 400)) || distance == undefined && ((Math.pow(x(note1, note2, 60), 2) + Math.pow(y(note1, note2, 60), 2)) < 900)) {
      return link;
    }
  }
}

const tidyGroup = (center, group, builders, isMax) => {
  if (group === undefined) return builders;

  const isProportional = (target) => ['code', 'audio', 'video', 'image'].includes(target?.note?.dtype);
  bfs(group, center, (graph, center, reset) => {
    const centerNote = builders[center].note;
    const directions = {
      0: (target) => {
        if (target?.note?.height > centerNote.height) reset();
        const height = isMax ? Math.max(target?.note?.height, centerNote.height) : centerNote.height;
        const ratio = target?.note?.width / target?.note?.height;
        const width = isProportional(target) ? height * ratio : target?.note?.width;
        return target?.setSize(width, height)?.setPosition(centerNote.x - width - 60, centerNote.y);
      }, 1: (target) => {
        if (target?.note?.width > centerNote.width) reset();
        const width = isMax ? Math.max(target?.note?.width, centerNote.width) : centerNote.width;
        const ratio = target?.note?.height / target?.note?.width;
        const height = isProportional(target) ? width * ratio : target?.note?.height;
        return target?.setSize(width, height)?.setPosition(centerNote.x, centerNote.y - height - 60);
      }, 2: (target) => {
        if (target?.note?.height > centerNote.height) reset();
        const height = isMax ? Math.max(target?.note?.height, centerNote.height) : centerNote.height;
        const ratio = target?.note?.width / target?.note?.height;
        const width = isProportional(target) ? height * ratio : target?.note?.width;
        return target?.setSize(width, height)?.setPosition(centerNote.x + centerNote.width + 60, centerNote.y);
      }, 3: (target) => {
        if (target?.note?.width > centerNote.width) reset();
        const width = isMax ? Math.max(target?.note?.width, centerNote.width) : centerNote.width;
        const ratio = target?.note?.height / target?.note?.width;
        const height = isProportional(target) ? width * ratio : target?.note?.height;
        return target?.setSize(width, height)?.setPosition(centerNote.x, centerNote.y + centerNote.height + 60);
      },
    };

    for (let i = 0; i < 4; i++) builders[group[center][i]] = directions[i]?.(builders[group[center][i]]);
  });
  
  return builders;
};

const splitGroups = (groups, builders, id1, id2, link) => {
  const dirs = ['left', 'top', 'right', 'bottom'];
  let modifiedBuilders = { [id1]: builders[id1], [id2]: builders[id2] };

  let group1 = getGroup(builders[id1]);
  let group2 = getGroup(builders[id2]);
  let groupId = findFree(groups)[0];

  groups[groupId] = {};
  groups[group2.groupId] ||= {};

  groups[group1.groupId] = {[id1]: {}, [id2]: {}, ...groups[group1.groupId], ...groups[group2.groupId]};
  groups[group1.groupId][id1][link] = id2;
  groups[group1.groupId][id2][(link + 2) % 4] = id1;
  builders[id1].setGroup(undefined).setGroupId(undefined);
  builders[id2].setGroup(undefined).setGroupId(undefined);  

  if (group1.groupId === group2.groupId && group1.groupId !== '') {
    delete groups?.[group1.groupId]?.[id1]?.[link];
    delete groups?.[group1.groupId]?.[id2]?.[(link + 2) % 4];
  }

  if (group1.groupId !== group2.groupId) delete groups[group2.groupId];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  bfs(groups[group1.groupId], id1, (group, current, _, parent) => {
    groups[groupId][current] ||= group[current];
    delete group[current];
    let node = Object.keys(groups?.[groupId]?.[current] || {});
    const nextLink = node.find(k => (groups?.[groupId]?.[current] || {})[k] === parent);
    builders[current].setGroupId(node.length === 0 ? undefined : `${groupId}`)
                     .setGroup(nextLink && `${groups[groupId][current][nextLink]}:${dirs[nextLink]}`);
    modifiedBuilders[current] = builders[current];
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  bfs(groups[group1.groupId], id2, (group, current, _, parent) => {
    if (groups?.[group1.groupId]?.[current] === undefined) return;
    let node = Object.keys(group?.[current] || {});
    const nextLink = node.find(k => (group?.[current] || {})[k] === parent);
    builders[current].setGroupId(node.length === 0 ? undefined : group2.groupId)
                     .setGroup(nextLink && `${group[current][nextLink]}:${dirs[nextLink]}`);
    modifiedBuilders[current] = builders[current];
  });

  if (Object.keys(groups[groupId]).length < 2) delete groups[groupId];
  if (Object.keys(groups[group1.groupId]).length < 2) delete groups[group1.groupId];

  return modifiedBuilders;
};

const findFree = (groups) => {
  let groupKeys = Object.keys(groups).sort();
  let ids = [];
  let i = 0;
  for (;i < groupKeys.length; i++) {
    if (parseInt(groupKeys[i]) > i) {
      ids.push(String(i).padStart(4, '0'));
      i += (parseInt(groupKeys[i]) - i)
    } 
  }
  ids.push(String(i).padStart(4, '0'));
  return ids;
}

const getGroup = (builder) => {
  const [linked, dir] = (builder.note?.group || ':').split(':');
  return {
    groupId: builder.note?.groupId || '',
    linked: linked,
    dir: dir,
  }
}

export { getLink, findFree, tidyGroup, getGroup, splitGroups};