export default function Loading() {
  return <div className="page-stack"><div className="skeleton heading-skeleton" /><div className="stat-grid">{[1,2,3,4].map((item) => <div className="skeleton card-skeleton" key={item} />)}</div><div className="skeleton table-skeleton" /></div>;
}
