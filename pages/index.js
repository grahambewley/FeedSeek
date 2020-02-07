import HeroCarousel from '../components/_App/HeroCarousel';
import HomeGrid from '../components/Index/HomeGrid';
import Modal from '../components/_App/DetailModal';
import baseUrl from '../utils/baseUrl';
import baseCraftUrl from '../utils/baseCraftUrl';
import axios from 'axios';
import cookie from 'js-cookie';
import { parseCookies } from 'nookies';

const Home = ({ initLikes, user, initNewsletters, initPodcasts, initBlogs, initLatest, initFeatured }) => {
    const [likes, setLikes] = React.useState(initLikes);    
    
    const [newsletters, setNewsletters] = React.useState(initNewsletters.slice(0,3));
    const [podcasts, setPodcasts] = React.useState(initPodcasts.slice(0,3));
    const [blogs, setBlogs] = React.useState(initBlogs.slice(0,3));
    const [latest, setLatest] = React.useState(initLatest.slice(0,3));

    const [detailModalOpen, setDetailModalOpen] = React.useState(false);
    const [detailModalEntity, setDetailModalEntity] = React.useState();
    
    async function handleFilterChange(dateSpan, categories) {

        let daysToSearch = null;
        switch(dateSpan) {
            case 'this week':
                daysToSearch = 7;
                break;
            case 'this month': 
                daysToSearch = 30;
            default:
                break;
        }

        const topUrl = `${baseUrl}/api/top`;

        const topNewslettersPayload = {
            params: { secId: 1, days: daysToSearch }
        };
        const topPodcastsPayload = {
            params: { secId: 2, days: daysToSearch }
        };
        const topBlogsPayload = {
            params: { secId: 3, days: daysToSearch }
        };
        // Get arrays of the top liked newsletters, podcasts, and blogs in the last 7 days
        // e.g. ['230', '249', '206']
        const topNewslettersResponse = await axios.get(topUrl, topNewslettersPayload);
        const topPodcastsResponse = await axios.get(topUrl, topPodcastsPayload);
        const topBlogsResponse = await axios.get(topUrl, topBlogsPayload);

        // Request the entries matching these IDs from CMS
        const nUrl = `${baseCraftUrl}/newsletters.json`;
        const pUrl = `${baseCraftUrl}/podcasts.json`;
        const bUrl = `${baseCraftUrl}/blogs.json`;
        
        const nPayload = { params: new URLSearchParams({ id: topNewslettersResponse.data, categories: categories }) };
        const pPayload = { params: new URLSearchParams({ id: topPodcastsResponse.data, categories: categories }) };
        const bPayload = { params: new URLSearchParams({ id: topBlogsResponse.data, categories: categories }) };
        
        const nResponse = await axios.get(nUrl, nPayload);
        const pResponse = await axios.get(pUrl, pPayload);
        const bResponse = await axios.get(bUrl, bPayload);
        
        console.log('newsletter response is ', nResponse);

        setNewsletters(nResponse.data.newsletters);
        setPodcasts(pResponse.data.podcasts);
        setBlogs(bResponse.data.blogs);
        
    }

    function triggerDetailModal(entity) {
        console.log("Triggering modal with entity:", entity);
        setDetailModalEntity(entity);
        setDetailModalOpen(true);
    }

    async function handleEntityLike(entity) {
        // Add entity to likes array
        const newLikes = likes;
        newLikes.push(parseInt(entity.id));
        setLikes(newLikes);

        // Add like to the likes collection
        const url = `${baseUrl}/api/like`;
        const payload = { entity };
        const token = cookie.get('token');
        // Sending user token along with this reqest to only allow authorized users to like stuff
        const headers = { headers: { Authorization: token } };
        const userLikeResponse = await axios.post(url, payload, headers);
    }
    
    async function handleEntityUnlike(entity) {
        // Remove entity from likes array
        const newLikes = likes.filter(element => {
            return (element != parseInt(entity.id));
        });
        setLikes(newLikes);

        // Remove like from likes collection
        const url = `${baseUrl}/api/like`;
        const token = cookie.get('token');
        const entityId = entity.id;
        const payload = { 
            params: { entityId },
            headers: { Authorization: token } 
        };
        const userUnlikeResponse = await axios.delete(url, payload);
    }

    return (<>
        <HeroCarousel featured={initFeatured}></HeroCarousel>

        <HomeGrid
            likes={likes}
            handleEntityLike={handleEntityLike}
            handleEntityUnlike={handleEntityUnlike}
            user={user}
            newsletters={newsletters}
            podcasts={podcasts}
            blogs={blogs}
            latest={latest}
            handleFilterChange={handleFilterChange}
            triggerDetailModal={triggerDetailModal}
        />
        <Modal 
            user={user}
            opened={detailModalOpen}
            close={() => setDetailModalOpen(false)}
            entity={detailModalEntity}
            likes={likes}
            handleEntityLike={handleEntityLike}
            handleEntityUnlike={handleEntityUnlike}
        />
    </>);
}

Home.getInitialProps = async ctx => {
    const topUrl = `${baseUrl}/api/top`;
    const topNewslettersPayload = {
        params: {
            secId: 1,
            days: 7
        }
    };
    const topPodcastsPayload = {
        params: {
            secId: 2,
            days: 7
        }
    };
    const topBlogsPayload = {
        params: {
            secId: 3,
            days: 7
        }
    };
    // Get arrays of the top liked newsletters, podcasts, and blogs in the last 7 days
    // e.g. ['230', '249', '206']
    const topNewslettersResponse = await axios.get(topUrl, topNewslettersPayload);
    const topPodcastsResponse = await axios.get(topUrl, topPodcastsPayload);
    const topBlogsResponse = await axios.get(topUrl, topBlogsPayload);

    // Request the entries matching these IDs from CMS

    const newslettersByIdUrl = `${baseCraftUrl}/newsletters.json`;
    const podcastsByIdUrl = `${baseCraftUrl}/podcasts.json`;
    const blogsByIdUrl = `${baseCraftUrl}/blogs.json`;
    // Getting latest entries to display in sidebar
    const latestAllUrl = `${baseCraftUrl}/latest.json`;
    // Getting featured entries to display in hero carousel
    const featuredAllUrl = `${baseCraftUrl}/featured.json`;

    const newslettersByIdPayload = { params: new URLSearchParams({ id: topNewslettersResponse.data }) };
    const podcastsByIdPayload = { params: new URLSearchParams({ id: topPodcastsResponse.data }) };
    const blogsByIdPayload = { params: new URLSearchParams({ id: topBlogsResponse.data }) };

    const newslettersByIdResponse = await axios.get(newslettersByIdUrl, newslettersByIdPayload);
    const podcastsByIdResponse = await axios.get(podcastsByIdUrl, podcastsByIdPayload);
    const blogsByIdResponse = await axios.get(blogsByIdUrl, blogsByIdPayload);
    const latestAllResponse = await axios.get(latestAllUrl);
    const featuredAllResponse = await axios.get(featuredAllUrl);

    // Get likes, to display appropriate thumbs-ups    
    const { token } = parseCookies(ctx);
    let likeArray;
    if(token) {
        const url = `${baseUrl}/api/like`;
        const payload = { headers: { Authorization: token } };
        const getLikesResponse = await axios.get(url, payload);
        likeArray = getLikesResponse.data.map(like => {
            return( like.entity );
        });
    } else {
        likeArray = [];
    }
    
    return {
        initLikes: likeArray,
        initNewsletters: newslettersByIdResponse.data.newsletters,
        initPodcasts: podcastsByIdResponse.data.podcasts,
        initBlogs: blogsByIdResponse.data.blogs,
        initLatest: latestAllResponse.data.data,
        initFeatured: featuredAllResponse.data.data
    }
}

export default Home;