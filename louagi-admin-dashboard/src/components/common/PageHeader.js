import React from 'react';

const PageHeader = ({
    title,
    subtitle,
    action,
    breadcrumbs = []
}) => {
    return (
        <div className="mb-6">
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
                <nav className="flex mb-3" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2">
                        {breadcrumbs.map((crumb, index) => (
                            <li key={index} className="flex items-center">
                                {index > 0 && (
                                    <span className="text-gray-400 mx-2">/</span>
                                )}
                                {crumb.href ? (
                                    <a
                                        href={crumb.href}
                                        className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        {crumb.label}
                                    </a>
                                ) : (
                                    <span className="text-sm text-gray-900 font-medium">
                                        {crumb.label}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            )}

            {/* Header content */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-1 text-sm text-gray-600">
                            {subtitle}
                        </p>
                    )}
                </div>

                {action && (
                    <div className="flex-shrink-0">
                        {action}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
