function PageSection({ title, description, children, action, id, className = "" }) {
  return (
    <section className={`panel ${className}`.trim()} id={id}>
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          {description ? <p className="muted-text">{description}</p> : null}
        </div>
        {action || null}
      </div>
      {children}
    </section>
  );
}

export default PageSection;
