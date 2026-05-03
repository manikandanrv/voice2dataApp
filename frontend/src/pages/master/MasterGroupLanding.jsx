import { NavLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function MasterGroupLanding({ title, subtitle, sections }) {
    return (
        <div className="container">
            <div className="page-title-wrap">
                <h1 className="page-title-text">{title}</h1>
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>

            {sections.map((section, idx) => (
                <section key={section.heading || `section-${idx}`} className="master-section">
                    {section.heading && (
                        <h2 className="master-section__heading">{section.heading}</h2>
                    )}
                    <div className="master-grid">
                        {section.items.map(item => (
                            <NavLink key={item.path} to={item.path} className="master-grid__card">
                                <div className="master-grid__card-body">
                                    <div className="master-grid__card-title">{item.label}</div>
                                    {item.description && (
                                        <div className="master-grid__card-desc">{item.description}</div>
                                    )}
                                </div>
                                <ChevronRight size={16} className="master-grid__card-chevron" />
                            </NavLink>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

export const MASTER_GROUPS = {
    yarn: {
        title: 'Yarn Masters',
        subtitle: 'Manage yarn-related reference data.',
        sections: [{
            items: [
                { label: 'Yarn Denier Master', path: '/master/yarn-denier-master' },
                { label: 'Yarn Color Master', path: '/master/yarn-color-master' },
                { label: 'Yarn Type Master', path: '/master/yarn-type-master' },
                { label: 'Yarn Supplier Master', path: '/master/yarn-supplier-master' },
                { label: 'Yarn Merge Master', path: '/master/yarn-merge-master' },
                { label: 'Yarn Composition Master', path: '/master/yarn-composition-master' },
            ],
        }],
    },
    twine: {
        title: 'Twine Masters',
        subtitle: 'Manage twine-related reference data.',
        sections: [{
            items: [
                { label: 'Twine Size Master', path: '/master/twine-size-master' },
                { label: 'Twine Twist Master', path: '/master/twine-twist-master' },
                { label: 'Twine Ply Master', path: '/master/twine-ply-master' },
                { label: 'Primary Ply Master', path: '/master/primary-ply-master' },
                { label: 'Twine Thread Master', path: '/master/twine-thread-master' },
                { label: 'Twine Strength Master', path: '/master/twine-strength-master' },
                { label: 'Twine Color Master', path: '/master/twine-color-master' },
            ],
        }],
    },
    cheesePacking: {
        title: 'Cheese Packing Master',
        subtitle: 'Configure packaging materials, locations, and bag sizes.',
        sections: [
            {
                heading: 'Configuration',
                items: [
                    { label: 'Size Settings', path: '/master/size-settings' },
                ],
            },
            {
                heading: 'Cheese Tube & Cover',
                items: [
                    { label: 'Cheese Tube Master', path: '/master/cheese-tube-master' },
                    { label: 'Cheese Tube Location', path: '/master/cheese-tube-location' },
                    { label: 'Cheese Cover Master', path: '/master/cheese-cover-master' },
                    { label: 'Cheese Cover Location', path: '/master/cheese-cover-location' },
                    { label: 'Cheese Tube Cover Master', path: '/master/cheese-tube-cover-master' },
                    { label: 'Cheese Tube Cover Location', path: '/master/cheese-tube-cover-location' },
                ],
            },
            {
                heading: 'Cheese Box & Sack',
                items: [
                    { label: 'Cheese Box Master', path: '/master/cheese-box-master' },
                    { label: 'Cheese Box Location', path: '/master/cheese-box-location' },
                    { label: 'Cheese Sack Master', path: '/master/cheese-sack-master' },
                    { label: 'Cheese Sack Location', path: '/master/cheese-sack-location' },
                    { label: 'Cheese Box Sack Master', path: '/master/cheese-box-sack-master' },
                    { label: 'Cheese Box Sack Location', path: '/master/cheese-box-sack-location' },
                ],
            },
        ],
    },
    size: {
        title: 'Size Masters',
        subtitle: 'Parsers used to interpret size strings across modules.',
        sections: [{
            items: [
                { label: 'Winder Size Parser', path: '/master/winder-size-parser' },
                { label: 'Twine Size Parser', path: '/master/twine-size-parser' },
                { label: 'TFO Primary Size Parser', path: '/master/tfo-primary-size-parser' },
                { label: 'Doubler Primary Size Parser', path: '/master/doubler-primary-size-parser' },
            ],
        }],
    },
};
