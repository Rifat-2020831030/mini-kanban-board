export default function BoardViewPage({ params }: { params: { boardId: string } }) {
  return <div>Board view {params.boardId}</div>;
}
