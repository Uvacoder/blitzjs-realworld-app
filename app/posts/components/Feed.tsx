import React from "react"
import {
  Box,
  Flex,
  Stack,
  Tabs,
  TabList,
  Tab,
  Button,
  Heading,
  Input,
  useColorMode,
} from "@chakra-ui/core"
import { useSession, useInfiniteQuery, useQuery, Link } from "blitz"
import getPostsInfinite from "../queries/getPostsInfinite"
import PostList from "../components/PostList"
import getTags from "app/tags/queries/getTags"
import { cardStyles } from "app/styles"

const Feed = ({ tagName = "" }) => {
  const { colorMode } = useColorMode()
  const session = useSession()
  const [feedQuery, setFeedQuery] = React.useState({})
  const [tabIndex, setTabIndex] = React.useState(0)
  const [tagFilter, setTagFilter] = React.useState("")

  const [postGroups, { refetch, isFetchingMore, fetchMore, canFetchMore }] = useInfiniteQuery(
    getPostsInfinite,
    {
      where: feedQuery,
      skip: 0,
      take: 5,
      include: {
        User: true,
        favoritedBy: true,
        tags: true,
      },
    },
    {
      getFetchMore: (lastGroup) => lastGroup.nextPage,
      enabled: Object.keys(feedQuery).length > 0,
    }
  )

  const [tags] = useQuery(getTags, {})

  React.useEffect(() => {
    const tagQuery = tagName
      ? {
          status: "published",
          tags: {
            some: {
              name: {
                contains: tagName,
              },
            },
          },
        }
      : { status: "published" }
    if (tabIndex === 0) {
      setFeedQuery({ ...tagQuery })
    } else if (tabIndex === 1 && session.userId) {
      setFeedQuery({
        User: {
          followedBy: {
            some: {
              id: {
                equals: session.userId,
              },
            },
          },
        },
        ...tagQuery,
      })
    }
  }, [tabIndex, session.userId, tagName])

  return (
    <Stack isInline spacing={[0, 0, 8]} w="100%">
      <Box w={["100%", "100%", "80%"]}>
        {tagName && <Heading># {tagName}</Heading>}
        <Tabs onChange={setTabIndex} index={tabIndex}>
          <TabList mb="8">
            <Tab>Global Feed</Tab>
            {session.userId && <Tab>Personal Feed</Tab>}
          </TabList>

          {postGroups?.map(({ posts }, i) => (
            <PostList key={i} refetch={refetch} posts={posts} />
          ))}
          {postGroups?.length > 0 && (
            <Flex mt="4" justify="center" align="center">
              <Button
                bg="bg-dark"
                color="text-light"
                isLoading={!!isFetchingMore}
                onClick={() => fetchMore()}
                isDisabled={!canFetchMore || !!isFetchingMore}
              >
                {canFetchMore ? "Load More Posts" : "That's All Folks :)"}
              </Button>
            </Flex>
          )}
        </Tabs>
      </Box>
      <Box mt="16" display={["none", "none", "block"]} w="20%">
        <Box {...{ ...cardStyles(colorMode), p: 3 }}>
          <Heading py="2" borderBottom="1px solid black" mb="4" size="md">
            Tags:
          </Heading>
          <Input onChange={(e) => setTagFilter(e.target.value)} placeholder="Search Tag" />
          <Flex maxH="60vh" overflowY="auto" flexDir="column">
            {tags
              .filter((t) => t.name.includes(tagFilter))
              .map((tag) => (
                <Box fontWeight={tagName === tag.name ? "600" : "300"} py="2">
                  <Link href="/tags/[tagName]" as={`/tags/${tag.name}`}>
                    {"#" + tag.name}
                  </Link>
                </Box>
              ))}
          </Flex>
        </Box>
      </Box>
    </Stack>
  )
}

export default Feed
